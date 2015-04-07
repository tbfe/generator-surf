<!doctype html>
<!--STATUS OK-->
<html>
<head>
	<title><?php $this->block('title', '美女吧') ?></title>
<?php
	$this->loadWidget('header', array(), 'common');
?>

</head>
<body>
	<?php
	$this->loadWidget('userbar', array(), 'common');
	?>
	<div class="header">
		<?php
			$this->startBlock('head');
				//$this->loadPagelet('forum-head', 'frs');
				echo "我是common头部内容";
			$this->endBlock('head');
		?>
	</div>
	<div class="main">
		<div class="content">
			<?php $this->block('content'); ?>
		</div>
		<div class="common-page-aside">
			<?php $this->block('aside', '我是common右侧内容'); ?>
		</div>
		<div class="foot">
			<?php $this->loadPagelet('footer', 'common'); ?>
		</div>
	</div>
</body>
